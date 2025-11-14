package com.example.service;

import com.example.entity.Staff;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.example.mapper.StaffMapper;
import org.springframework.stereotype.Service;

import javax.annotation.Resource;

@Service
public class StaffService extends ServiceImpl<StaffMapper, Staff> {

    @Resource
    private StaffMapper staffMapper;

}

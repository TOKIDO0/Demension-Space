package com.example.service;

import com.example.entity.Constructionrec;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.example.mapper.ConstructionrecMapper;
import org.springframework.stereotype.Service;

import javax.annotation.Resource;

@Service
public class ConstructionrecService extends ServiceImpl<ConstructionrecMapper, Constructionrec> {

    @Resource
    private ConstructionrecMapper constructionrecMapper;

}

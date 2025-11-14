package com.example.service;

import com.example.entity.Constructioninfo;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.example.mapper.ConstructioninfoMapper;
import org.springframework.stereotype.Service;

import javax.annotation.Resource;

@Service
public class ConstructioninfoService extends ServiceImpl<ConstructioninfoMapper, Constructioninfo> {

    @Resource
    private ConstructioninfoMapper constructioninfoMapper;

}
